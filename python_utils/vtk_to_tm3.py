import xml.etree.ElementTree as ET
import base64
import numpy as np

def read_vtp(fname, prop):

    tree = ET.parse(fname)
    root = tree.getroot()

    appended_data_string = root.find("./AppendedData").text.strip()[1:]

    data_arrays=[]
    for data_array in root.iter('DataArray'):
        d = data_array.attrib
        data_array_now = {'name':d['Name'], 'type':d['type'], 'offset':int(d['offset'])}
        data_arrays.append(data_array_now)

    for indx, data_array in enumerate(data_arrays):
        offset_now = data_array['offset']
        type_now = data_array['type']

        if ( indx == len(data_arrays)-1 ):
            offset_nxt = len(appended_data_string)
        else:    
            offset_nxt = data_arrays[indx+1]['offset']

        buffer = base64.b64decode(appended_data_string[offset_now:offset_nxt])

        if ( type_now == 'Float64' ):
            data = np.frombuffer( buffer, dtype=np.float64, offset=8)
            data_array['data'] = np.float32(data)

        if ( type_now == 'Int64' ):
            data = np.frombuffer( buffer, dtype=np.int64, offset=8)
            data_array['data'] = np.int32(data)


    polys = root.find("./PolyData/Piece/Polys")
    polys_connectivity_data_array = polys.find("DataArray")
    polys_connectivity_offset = int(polys_connectivity_data_array.attrib['offset'])

    indices = [ d for d in data_arrays if d['offset'] == polys_connectivity_offset][0]['data']
    if ( np.size(indices) == 0 ):
        return 0, 0, np.array([]), np.array([]), np.array([])
    vertices = [ d for d in data_arrays if d['name'] == 'Points'][0]['data']
    values = [ d for d in data_arrays if d['name'] == prop][0]['data']

    nverts = np.int32(np.size(vertices)/3)
    ntris = np.int32(np.size(indices)/3)

    return nverts, ntris, vertices, indices, values

def centre_vertices(vertices):

    xvert = vertices[0::3] 
    yvert = vertices[1::3] 
    zvert = vertices[2::3] 

    xmid = np.mean(xvert)
    ymid = np.mean(yvert)
    zmid = np.mean(zvert)

    xvert -= xmid
    yvert -= ymid
    zvert -= zmid

    rmax = np.sqrt(np.max(xvert**2 + yvert**2 + zvert**2))

    xmin = np.min(xvert) 
    xmax = np.max(xvert)
    ymin = np.min(yvert) 
    ymax = np.max(yvert)
    zmin = np.min(zvert) 
    zmax = np.max(zvert)
  

    vertices[0::3] = xvert
    vertices[1::3] = yvert
    vertices[2::3] = zvert

    return vertices, np.float32(rmax), np.float32([xmin,xmax]), np.float32([ymin,ymax]), np.float32([zmin,zmax])

def normalise(values):

    vmin = np.min(values)
    vmax = np.max(values)
    v_range = vmax - vmin
    values = (values - vmin)/v_range

    return values, np.float32([vmin,vmax])

def read_vtm(fname):

    tree = ET.parse(fname)
    root = tree.getroot()

    file_names = []
    for data_set in root.iter('DataSet'):
        d = data_set.attrib
        try:
            file_names.append(d['file'])
        except:
            pass
      
    return file_names

def vtm_to_tm3(vtmfile_and_prop_array):
  
    n_surfaces = len(vtmfile_and_prop_array) # currently works for only one surface

    for fp in vtmfile_and_prop_array:
        vtm_file = fp['fname']
        selected_prop = fp['prop']
        vtp_file_names = read_vtm(vtm_file)
        
        for indx, file_name in enumerate(vtp_file_names):
            if (indx == 0):
                nverts, ntris, vertices, indices, values = read_vtp(file_name, selected_prop)
            else:
                nverts_now, ntris_now, vertices_now, indices_now, values_now = read_vtp(file_name, selected_prop)
                if (nverts_now == 0):
                    continue
                indices_now += nverts
                nverts += nverts_now
                ntris += ntris_now
                vertices = np.concatenate((vertices, vertices_now))
                indices = np.concatenate((indices,indices_now))
                values = np.concatenate((values,values_now))
       
        vertices, rmax, x_min_max, y_min_max, z_min_max = centre_vertices(vertices)
        values, v_min_max = normalise(values)

    f = open(vtm_file[:-3]+"tm3","wb")
    f.write(np.int32(1).tobytes())
    f.write(nverts.tobytes())
    f.write(ntris.tobytes())
    f.write(np.int32(1).tobytes())
    f.write(rmax.tobytes())
    f.write(x_min_max.tobytes())
    f.write(y_min_max.tobytes())
    f.write(z_min_max.tobytes())
    f.write(vertices.tobytes())
    f.write(indices.tobytes())
    f.write(v_min_max.tobytes())
    f.write(values.tobytes())
    f.close()


# to do
# add x range, y range, z range to tm3
# make module so just take list of vtm files and list of props - array of dictionaries
# main method is vtm_to_tm3
# (could also add vtu_to_tm3 later)
